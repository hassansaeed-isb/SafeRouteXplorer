from bs4 import BeautifulSoup

def test_index_html():
    """
    Test the structure of the index.html file.
    """
    with open("templates/index1.html") as html_file:
        soup = BeautifulSoup(html_file, "html.parser")

        # Check the title
        title = soup.find("title")
        assert title is not None, "HTML should have a title"
        assert title.text == "SafeRouteXplorer", "Title should be 'SafeRouteXplorer'"

        # Check for the navbar
        nav = soup.find("nav")
        assert nav is not None, "HTML should have a navbar"

        # Check for map container
        map_div = soup.find("div", {"id": "map"})
        assert map_div is not None, "HTML should have a map container with id 'map'"

        # Check for the routes container
        routes_container = soup.find("div", {"id": "routes-container"})
        assert routes_container is not None, "HTML should have a container for routes with id 'routes-container'"
